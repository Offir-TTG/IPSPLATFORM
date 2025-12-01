-- =====================================================
-- Update Enrollments Status Constraint
-- =====================================================
-- This script updates the enrollments table to support
-- the new 6-status workflow WITHOUT dropping data
-- =====================================================

-- Step 1: Drop the old constraint
ALTER TABLE public.enrollments
  DROP CONSTRAINT IF EXISTS enrollments_status_check;

-- Step 2: Add the new constraint with 6 statuses
ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_status_check
  CHECK (status IN ('draft', 'pending', 'active', 'suspended', 'cancelled', 'completed'));

-- Step 3: Update the default value
ALTER TABLE public.enrollments
  ALTER COLUMN status SET DEFAULT 'draft';

-- Step 4: Update the column comment
COMMENT ON COLUMN enrollments.status IS 'Enrollment lifecycle status: draft (created, email not sent), pending (email sent, awaiting user action), active (user enrolled and can access), suspended (temporarily paused), cancelled, or completed';

-- Success message
DO $$ BEGIN
  RAISE NOTICE 'Enrollments table status constraint updated successfully! New statuses: draft, pending, active, suspended, cancelled, completed';
END $$;
