-- Add security-related fields to users table

-- Add password_last_changed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_last_changed'
  ) THEN
    ALTER TABLE users ADD COLUMN password_last_changed TIMESTAMPTZ;
  END IF;
END$$;

-- Add is_active column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
  END IF;
END$$;

-- Add deactivated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN deactivated_at TIMESTAMPTZ;
  END IF;
END$$;

-- Create index for active users query
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active) WHERE is_active = TRUE;

-- Create index for deactivated users
CREATE INDEX IF NOT EXISTS idx_users_deactivated ON users(deactivated_at) WHERE deactivated_at IS NOT NULL;

-- Update existing users to be active
UPDATE users SET is_active = TRUE WHERE is_active IS NULL;

-- Add comment to columns
COMMENT ON COLUMN users.password_last_changed IS 'Timestamp when the user last changed their password';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active (soft delete flag)';
COMMENT ON COLUMN users.deactivated_at IS 'Timestamp when the user account was deactivated';
