-- Add enrollment token fields for email invitation system
-- This migration enables secure token-based enrollment links

-- Add enrollment token and related fields
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrollment_token TEXT;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMPTZ;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS invitation_sent_by UUID REFERENCES users(id);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS email_language TEXT DEFAULT 'en';
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrolled_at TIMESTAMPTZ;

-- Create index for token lookups (only non-null tokens)
CREATE INDEX IF NOT EXISTS idx_enrollments_token
  ON enrollments(enrollment_token)
  WHERE enrollment_token IS NOT NULL;

-- Add unique constraint on tokens (prevents duplicate tokens)
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_token_unique
  ON enrollments(enrollment_token)
  WHERE enrollment_token IS NOT NULL;

-- Create index for expiration checks
CREATE INDEX IF NOT EXISTS idx_enrollments_token_expires
  ON enrollments(token_expires_at)
  WHERE token_expires_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN enrollments.enrollment_token IS 'Secure token for enrollment invitation link (32 bytes, base64url)';
COMMENT ON COLUMN enrollments.token_expires_at IS 'When the enrollment token expires (7 days from sending)';
COMMENT ON COLUMN enrollments.invitation_sent_at IS 'When the enrollment invitation email was sent';
COMMENT ON COLUMN enrollments.invitation_sent_by IS 'Admin who sent the enrollment invitation';
COMMENT ON COLUMN enrollments.email_language IS 'Language code for enrollment invitation email (en, he)';
COMMENT ON COLUMN enrollments.enrolled_at IS 'When user accepted the enrollment (status became active)';
