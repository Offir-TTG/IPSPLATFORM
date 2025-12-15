-- Add 'whiteboard' to the lesson_topics content_type CHECK constraint

-- Drop the existing constraint
ALTER TABLE lesson_topics DROP CONSTRAINT IF EXISTS lesson_topics_content_type_check;

-- Add the new constraint with 'whiteboard' included
ALTER TABLE lesson_topics ADD CONSTRAINT lesson_topics_content_type_check
  CHECK (content_type IN ('video', 'text', 'pdf', 'quiz', 'assignment', 'link', 'embed', 'download', 'whiteboard'));

-- Add comment
COMMENT ON CONSTRAINT lesson_topics_content_type_check ON lesson_topics IS 'Allowed content types including whiteboard';
