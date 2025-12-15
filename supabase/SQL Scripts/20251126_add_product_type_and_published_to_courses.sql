-- =====================================================
-- Add Product Type and Published Status to Courses
-- =====================================================
-- This migration adds product_type and is_published fields
-- to allow better categorization and publishing control
-- =====================================================

-- Add product_type column (matching ProductType from products)
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS product_type TEXT CHECK (product_type IN (
  'program', 'course', 'bundle', 'session_pack', 'lecture',
  'workshop', 'webinar', 'session', 'custom'
));

-- Add is_published column for publishing control
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.courses.product_type IS 'Product type for this course (aligns with Product entity types)';
COMMENT ON COLUMN public.courses.is_published IS 'Whether this course is published and visible to users in the UI';

-- Add index for filtering published courses
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published) WHERE is_published = true;

-- Add index for filtering by product_type
CREATE INDEX IF NOT EXISTS idx_courses_product_type ON public.courses(product_type) WHERE product_type IS NOT NULL;
