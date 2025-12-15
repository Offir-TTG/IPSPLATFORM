-- =====================================================
-- Remove Product Type from Courses
-- =====================================================
-- This migration removes the product_type field from courses
-- The course_type field will be used instead for categorization
-- =====================================================

-- Drop the index first
DROP INDEX IF EXISTS idx_courses_product_type;

-- Drop the column
ALTER TABLE public.courses
DROP COLUMN IF EXISTS product_type;
