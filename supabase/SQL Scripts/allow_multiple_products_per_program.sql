-- =====================================================
-- Allow Multiple Products Per Program/Course
-- Date: 2025-01-16
--
-- Issue: Current unique indexes prevent multiple products
-- from being created for the same program or course.
--
-- Business Requirement: Need to support multiple products
-- for the same program/course (e.g., different pricing tiers,
-- payment plans, markets, etc.)
--
-- Solution: Drop the unique indexes on program_id and course_id
-- =====================================================

BEGIN;

-- Drop unique indexes that prevent multiple products per program/course
DROP INDEX IF EXISTS unique_program_id;
DROP INDEX IF EXISTS unique_course_id;

-- Add helpful comment to the table
COMMENT ON TABLE products IS 'Products can have multiple entries for the same program_id or course_id to support different pricing tiers, payment plans, and market segments.';

COMMIT;

-- =====================================================
-- Summary:
-- - Removed unique_program_id index
-- - Removed unique_course_id index
-- - Multiple products can now be created for same program/course
-- - Use title and metadata to differentiate between products
-- =====================================================
