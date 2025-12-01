-- =====================================================
-- Add User Profile Fields
-- =====================================================
-- Adds additional profile fields to users table:
-- - avatar_url: URL to user's profile image
-- - bio: User biography/description
-- - location: User's location (city, country)
-- - timezone: User's timezone preference
-- - website: Personal website URL
-- - linkedin_url: LinkedIn profile URL
-- - github_url: GitHub profile URL
-- - twitter_url: Twitter profile URL
-- =====================================================

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jerusalem',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile image stored in Supabase Storage';
COMMENT ON COLUMN users.bio IS 'User biography/description text';
COMMENT ON COLUMN users.location IS 'User location (city, country)';
COMMENT ON COLUMN users.timezone IS 'User timezone preference (e.g., Asia/Jerusalem, America/New_York)';
COMMENT ON COLUMN users.website IS 'User personal website URL';
COMMENT ON COLUMN users.linkedin_url IS 'User LinkedIn profile URL';
COMMENT ON COLUMN users.github_url IS 'User GitHub profile URL';
COMMENT ON COLUMN users.twitter_url IS 'User Twitter/X profile URL';
