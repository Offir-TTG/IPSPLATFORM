-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINT TO INSTRUCTOR_BRIDGE_LINKS
-- ============================================================================
-- Now that we confirmed courses table exists, add the foreign key constraint
-- ============================================================================

ALTER TABLE public.instructor_bridge_links
  ADD CONSTRAINT fk_instructor_bridge_links_course
  FOREIGN KEY (course_id)
  REFERENCES public.courses(id)
  ON DELETE CASCADE;

-- Verify the constraint was added
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.instructor_bridge_links'::regclass
  AND contype = 'f'; -- foreign key constraints
