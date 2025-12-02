-- ============================================================================
-- Add expires_at Column to Enrollments Table
-- ============================================================================
-- Description: Add optional expiration date for enrollments
-- Author: Claude Code Assistant
-- Date: 2025-12-02

-- Add expires_at column to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Create index for efficient querying of expiring enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at
  ON enrollments(expires_at)
  WHERE expires_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN enrollments.expires_at IS 'Optional expiration date for the enrollment (e.g., access ends after this date)';
