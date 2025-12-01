-- Add contact_email column to users table
-- This is the email for receiving messages, separate from login email

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS is_whatsapp BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN public.users.contact_email IS 'Email address for receiving messages (can differ from login email)';
COMMENT ON COLUMN public.users.is_whatsapp IS 'Indicates if the phone number is also a WhatsApp number';
