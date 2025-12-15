-- =====================================================
-- Add Enrollment Tracking Fields
-- =====================================================
-- Adds fields to user_programs table to track:
-- - enrollment_type: Distinguish admin-assigned vs self-enrolled
-- - created_by: Track which admin created the enrollment
-- =====================================================

-- Add enrollment_type column
ALTER TABLE user_programs
ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'self_enrolled' CHECK (enrollment_type IN ('admin_assigned', 'self_enrolled'));

-- Add created_by column (references users table)
ALTER TABLE user_programs
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id);

-- Add index for created_by for better query performance
CREATE INDEX IF NOT EXISTS idx_user_programs_created_by ON user_programs(created_by);

-- Add index for enrollment_type for filtering
CREATE INDEX IF NOT EXISTS idx_user_programs_enrollment_type ON user_programs(enrollment_type);

-- Add comment to explain the fields
COMMENT ON COLUMN user_programs.enrollment_type IS 'Type of enrollment: admin_assigned (manually enrolled by admin) or self_enrolled (enrolled by user)';
COMMENT ON COLUMN user_programs.created_by IS 'Admin user who created this enrollment (NULL for self-enrolled)';
