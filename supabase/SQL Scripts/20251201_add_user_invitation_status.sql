-- Add user status and invitation tracking fields
-- This migration supports the enrollment pre-registration system

-- Add status column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint for valid statuses
ALTER TABLE users ADD CONSTRAINT users_status_check
  CHECK (status IN ('invited', 'active', 'suspended', 'deleted'));

-- Create index for status lookups
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Add invitation tracking fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_by UUID REFERENCES users(id);

-- Add onboarding tracking fields for enrollment completion flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_enrollment_id UUID REFERENCES enrollments(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Create index for onboarding lookups
CREATE INDEX IF NOT EXISTS idx_users_onboarding
  ON users(onboarding_enrollment_id)
  WHERE onboarding_enrollment_id IS NOT NULL;

-- Update existing users to 'active' status
UPDATE users SET status = 'active' WHERE status IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.status IS 'User status: invited (pre-registration), active (normal), suspended, deleted';
COMMENT ON COLUMN users.invited_at IS 'When user was invited (for pre-registration enrollments)';
COMMENT ON COLUMN users.invited_by IS 'Admin who invited this user';
COMMENT ON COLUMN users.onboarding_enrollment_id IS 'Enrollment ID user is currently onboarding for';
COMMENT ON COLUMN users.onboarding_completed IS 'Whether user has completed enrollment onboarding';
