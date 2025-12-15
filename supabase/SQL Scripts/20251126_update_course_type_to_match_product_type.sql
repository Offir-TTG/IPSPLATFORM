-- =====================================================
-- Update Course Type to Match Product Type
-- =====================================================
-- This migration updates the course_type field to include
-- all the same types as ProductType in the products system
-- =====================================================

-- First, drop the existing CHECK constraint on course_type
ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS courses_course_type_check;

-- Update the course_type column with the new CHECK constraint
-- matching ProductType values (excluding 'program' which is not applicable to courses)
ALTER TABLE public.courses
ADD CONSTRAINT courses_course_type_check CHECK (course_type IN (
  'course',
  'lecture',
  'workshop',
  'webinar',
  'session',
  'session_pack',
  'bundle',
  'custom'
));

-- Update the column comment to reflect the new types
COMMENT ON COLUMN public.courses.course_type IS 'Type of educational content - matches ProductType (excluding program): course, lecture, workshop, webinar, session, session_pack, bundle, custom';
