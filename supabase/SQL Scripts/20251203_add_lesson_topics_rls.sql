-- Add RLS policies for lesson_topics table
-- This allows admins to create, read, update, and delete lesson topics

-- Enable RLS on lesson_topics table
ALTER TABLE lesson_topics ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Admin users can view all lesson topics" ON lesson_topics;
DROP POLICY IF EXISTS "Admin users can insert lesson topics" ON lesson_topics;
DROP POLICY IF EXISTS "Admin users can update lesson topics" ON lesson_topics;
DROP POLICY IF EXISTS "Admin users can delete lesson topics" ON lesson_topics;

-- Policy for SELECT (viewing lesson topics)
-- Allow admins to view all lesson topics
CREATE POLICY "Admin users can view all lesson topics"
ON lesson_topics
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy for INSERT (creating lesson topics)
-- Allow admins to create lesson topics
CREATE POLICY "Admin users can insert lesson topics"
ON lesson_topics
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy for UPDATE (editing lesson topics)
-- Allow admins to update lesson topics
CREATE POLICY "Admin users can update lesson topics"
ON lesson_topics
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Policy for DELETE (deleting lesson topics)
-- Allow admins to delete lesson topics
CREATE POLICY "Admin users can delete lesson topics"
ON lesson_topics
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Add comment
COMMENT ON TABLE lesson_topics IS 'Lesson topics (content blocks) - protected by RLS policies for admin access';
