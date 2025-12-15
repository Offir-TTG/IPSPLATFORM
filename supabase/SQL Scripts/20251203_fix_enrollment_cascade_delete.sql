-- Fix enrollment cascade delete issue
-- Change user_id foreign key from ON DELETE CASCADE to ON DELETE SET NULL
-- This prevents enrollments from being deleted when a user is deleted

-- First, make user_id nullable (it will be null if user is deleted)
ALTER TABLE enrollments
ALTER COLUMN user_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_user_id_fkey;

-- Add new foreign key constraint with SET NULL instead of CASCADE
ALTER TABLE enrollments
ADD CONSTRAINT enrollments_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- Add comment to document the behavior
COMMENT ON COLUMN enrollments.user_id IS 'User ID - set to NULL if user is deleted to preserve enrollment history';

-- Add index for user_id lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id
ON enrollments(user_id)
WHERE user_id IS NOT NULL;
