-- =====================================================
-- Fix Products Unique Constraints
-- Date: 2025-01-13
--
-- Issue: Current unique constraints on program_id and course_id
-- use NULLS NOT DISTINCT, which prevents multiple products
-- from having NULL values. This is too restrictive.
--
-- Solution: Drop the overly restrictive constraints and
-- create partial unique indexes that only apply to non-NULL values.
-- =====================================================

BEGIN;

-- Drop existing unique constraints
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS unique_program,
  DROP CONSTRAINT IF EXISTS unique_course;

-- Create partial unique indexes that only enforce uniqueness for non-NULL values
-- This allows multiple products with program_id = NULL (bundles, sessions, etc.)
-- but still prevents duplicate program_id for actual programs
CREATE UNIQUE INDEX unique_program_id
  ON products(program_id, tenant_id)
  WHERE program_id IS NOT NULL;

CREATE UNIQUE INDEX unique_course_id
  ON products(course_id, tenant_id)
  WHERE course_id IS NOT NULL;

-- Add helpful comment
COMMENT ON INDEX unique_program_id IS 'Ensures only one product per program per tenant. NULL program_id values are not restricted.';
COMMENT ON INDEX unique_course_id IS 'Ensures only one product per course per tenant. NULL course_id values are not restricted.';

COMMIT;

-- =====================================================
-- Summary:
-- - Removed NULLS NOT DISTINCT constraints
-- - Added partial unique indexes for non-NULL values only
-- - Now allows multiple products with NULL program_id/course_id
-- - Still prevents duplicate products for actual programs/courses
-- =====================================================
