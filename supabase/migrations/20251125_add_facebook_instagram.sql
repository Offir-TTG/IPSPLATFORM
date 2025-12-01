-- Add Facebook and Instagram URL fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;
