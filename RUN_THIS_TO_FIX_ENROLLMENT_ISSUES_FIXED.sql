-- ============================================================================
-- COMPREHENSIVE FIX: Enrollment System Issues
-- ============================================================================
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX ALL CURRENT ISSUES
--
-- Issues Fixed:
-- 1. Incorrect users_id_fkey constraint preventing user creation
-- 2. Missing expires_at column in enrollments table
-- 3. Missing translations for stats cards and email validation
-- ============================================================================

-- ============================================================================
-- PART 1: Fix Users Table Foreign Key Constraint
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '=== PART 1: Fixing users table constraints ===';

  -- Step 1: Check current constraints
  RAISE NOTICE 'Current foreign key constraints on users table:';
  FOR r IN
    SELECT conname, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND contype = 'f'
  LOOP
    RAISE NOTICE '  - %: %', r.conname, r.definition;
  END LOOP;
END$$;

-- Step 2: Drop the incorrect users_id_fkey constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_id_fkey;

-- Step 3: Drop existing invited_by constraint if any (to recreate it properly)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_invited_by_fkey;

-- Step 4: Recreate invited_by constraint with proper naming and NULL handling
ALTER TABLE users
ADD CONSTRAINT users_invited_by_fkey
FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  RAISE NOTICE '✓ Fixed users table foreign key constraints';
END$$;

-- ============================================================================
-- PART 2: Add expires_at Column to Enrollments
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 2: Adding expires_at column to enrollments ===';
END$$;

-- Add expires_at column to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for efficient querying of expiring enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at
  ON enrollments(expires_at)
  WHERE expires_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN enrollments.expires_at IS 'Optional expiration date for the enrollment (e.g., access ends after this date)';

DO $$
BEGIN
  RAISE NOTICE '✓ Added expires_at column to enrollments table';
END$$;

-- ============================================================================
-- PART 3: Add Enrollment Stats Cards Translations
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '=== PART 3: Adding enrollment stats cards translations ===';
END$$;

INSERT INTO translations (translation_key, language_code, translation_value, context, tenant_id)
VALUES
  -- Total stat card
  ('admin.enrollments.stats.total', 'en', 'Total', 'admin', NULL::uuid),
  ('admin.enrollments.stats.total', 'he', 'סה"כ', 'admin', NULL::uuid),
  ('admin.enrollments.stats.totalDesc', 'en', 'All enrollments', 'admin', NULL::uuid),
  ('admin.enrollments.stats.totalDesc', 'he', 'כל ההרשמות', 'admin', NULL::uuid),

  -- Draft stat card
  ('admin.enrollments.stats.draft', 'en', 'Draft', 'admin', NULL::uuid),
  ('admin.enrollments.stats.draft', 'he', 'טיוטה', 'admin', NULL::uuid),
  ('admin.enrollments.stats.draftDesc', 'en', 'Not sent yet', 'admin', NULL::uuid),
  ('admin.enrollments.stats.draftDesc', 'he', 'טרם נשלח', 'admin', NULL::uuid),

  -- Pending stat card
  ('admin.enrollments.stats.pending', 'en', 'Pending', 'admin', NULL::uuid),
  ('admin.enrollments.stats.pending', 'he', 'ממתין', 'admin', NULL::uuid),
  ('admin.enrollments.stats.pendingDesc', 'en', 'Awaiting completion', 'admin', NULL::uuid),
  ('admin.enrollments.stats.pendingDesc', 'he', 'ממתין להשלמה', 'admin', NULL::uuid),

  -- Active stat card
  ('admin.enrollments.stats.active', 'en', 'Active', 'admin', NULL::uuid),
  ('admin.enrollments.stats.active', 'he', 'פעיל', 'admin', NULL::uuid),
  ('admin.enrollments.stats.activeDesc', 'en', 'Currently enrolled', 'admin', NULL::uuid),
  ('admin.enrollments.stats.activeDesc', 'he', 'רשום כעת', 'admin', NULL::uuid),

  -- Completed stat card
  ('admin.enrollments.stats.completed', 'en', 'Completed', 'admin', NULL::uuid),
  ('admin.enrollments.stats.completed', 'he', 'הושלם', 'admin', NULL::uuid),
  ('admin.enrollments.stats.completedDesc', 'en', 'Finished', 'admin', NULL::uuid),
  ('admin.enrollments.stats.completedDesc', 'he', 'סיים', 'admin', NULL::uuid),

  -- Cancelled stat card
  ('admin.enrollments.stats.cancelled', 'en', 'Cancelled', 'admin', NULL::uuid),
  ('admin.enrollments.stats.cancelled', 'he', 'מבוטל', 'admin', NULL::uuid),
  ('admin.enrollments.stats.cancelledDesc', 'en', 'Cancelled', 'admin', NULL::uuid),
  ('admin.enrollments.stats.cancelledDesc', 'he', 'מבוטל', 'admin', NULL::uuid),

  -- Email validation translations
  ('admin.enrollments.create.checkingEmail', 'en', 'Checking email...', 'admin', NULL::uuid),
  ('admin.enrollments.create.checkingEmail', 'he', 'בודק אימייל...', 'admin', NULL::uuid),
  ('admin.enrollments.create.emailAvailable', 'en', 'Email is available', 'admin', NULL::uuid),
  ('admin.enrollments.create.emailAvailable', 'he', 'האימייל זמין', 'admin', NULL::uuid),
  ('admin.enrollments.create.emailExistsWarning', 'en', 'This email is already registered. Please select the existing user from the dropdown instead.', 'admin', NULL::uuid),
  ('admin.enrollments.create.emailExistsWarning', 'he', 'האימייל כבר רשום במערכת. אנא בחר את המשתמש הקיים מהרשימה.', 'admin', NULL::uuid),
  ('admin.enrollments.create.emailExists', 'en', 'A user with this email already exists. Please use the "Select User" option instead.', 'admin', NULL::uuid),
  ('admin.enrollments.create.emailExists', 'he', 'משתמש עם אימייל זה כבר קיים. אנא השתמש באפשרות "בחר משתמש".', 'admin', NULL::uuid),

  -- Cancelled payment status
  ('admin.enrollments.paymentStatus.cancelled', 'en', 'Cancelled', 'admin', NULL::uuid),
  ('admin.enrollments.paymentStatus.cancelled', 'he', 'מבוטל', 'admin', NULL::uuid)

ON CONFLICT (translation_key, language_code, context) WHERE tenant_id IS NULL
DO UPDATE SET
  translation_value = EXCLUDED.translation_value,
  updated_at = NOW();

DO $$
BEGIN
  RAISE NOTICE '✓ Added all enrollment translations';
END$$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
DECLARE
  r RECORD;
  constraint_count INT := 0;
  translation_count INT;
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';

  -- Verify users table constraints
  RAISE NOTICE 'Final users table foreign key constraints:';
  FOR r IN
    SELECT conname, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'users'::regclass AND contype = 'f' AND conname LIKE '%invited%'
  LOOP
    RAISE NOTICE '  ✓ %: %', r.conname, r.definition;
    constraint_count := constraint_count + 1;
  END LOOP;

  IF constraint_count = 0 THEN
    RAISE WARNING 'No invited_by constraint found! Check if migration succeeded.';
  END IF;

  -- Verify enrollments.expires_at column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'enrollments' AND column_name = 'expires_at'
  ) THEN
    RAISE NOTICE '✓ enrollments.expires_at column exists';
  ELSE
    RAISE WARNING 'enrollments.expires_at column NOT found!';
  END IF;

  -- Count translations added
  SELECT COUNT(*) INTO translation_count
  FROM translations
  WHERE translation_key LIKE 'admin.enrollments.%'
    AND tenant_id IS NULL;

  RAISE NOTICE '✓ Found % enrollment-related translations', translation_count;

  RAISE NOTICE '=== ALL FIXES APPLIED SUCCESSFULLY ===';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '  1. Create new enrollments with new users';
  RAISE NOTICE '  2. Set expiration dates for enrollments';
  RAISE NOTICE '  3. See all 6 stat cards with proper translations';
END$$;
