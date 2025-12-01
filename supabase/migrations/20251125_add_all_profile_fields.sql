-- Add all missing profile fields to users table
-- This migration adds: avatar_url, bio, location, timezone, website, linkedin_url

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Jerusalem',
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.users.avatar_url IS 'URL to user profile avatar image stored in user-avatars bucket';
COMMENT ON COLUMN public.users.bio IS 'User biography/about text';
COMMENT ON COLUMN public.users.location IS 'User location (city, country)';
COMMENT ON COLUMN public.users.timezone IS 'User timezone for scheduling (default: Asia/Jerusalem)';
COMMENT ON COLUMN public.users.website IS 'User personal or professional website URL';
COMMENT ON COLUMN public.users.linkedin_url IS 'User LinkedIn profile URL';
COMMENT ON COLUMN public.users.facebook_url IS 'User Facebook profile URL';
COMMENT ON COLUMN public.users.instagram_url IS 'User Instagram profile URL';
