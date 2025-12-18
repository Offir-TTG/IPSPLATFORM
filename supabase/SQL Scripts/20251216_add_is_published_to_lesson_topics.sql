-- Add is_published column to lesson_topics table
-- This column is needed for publishing control at the topic level

ALTER TABLE lesson_topics
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_lesson_topics_is_published ON lesson_topics(is_published);

-- Add comment
COMMENT ON COLUMN lesson_topics.is_published IS 'Whether this topic is published and visible to students';
