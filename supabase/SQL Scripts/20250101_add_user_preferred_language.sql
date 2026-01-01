-- Add preferred_language column to users table
-- This allows users to save their language preference independently of runtime selection

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN public.users.preferred_language IS 'User''s preferred language code (e.g., en, he, es, fr). NULL means use tenant default.';

-- Create index for faster queries when filtering by language
CREATE INDEX IF NOT EXISTS idx_users_preferred_language ON public.users(preferred_language);

-- Update existing users to NULL (they will inherit tenant default or use localStorage)
-- No need to set a default value, NULL is intentional
