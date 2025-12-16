-- =====================================================
-- ADD COLOR_CODE COLUMN TO GRADE_CATEGORIES
-- =====================================================

-- Add color_code column to grade_categories table
ALTER TABLE grade_categories
ADD COLUMN IF NOT EXISTS color_code TEXT;

-- Add a comment
COMMENT ON COLUMN grade_categories.color_code IS 'Hex color code for visual representation (e.g., #3B82F6)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added color_code column to grade_categories table';
  RAISE NOTICE 'Categories can now have custom colors for visual differentiation';
END $$;
