-- Add stripe_customer_id column to users table
-- This column stores the Stripe customer ID for each user
-- Created: 2025-12-23

-- Add the column if it doesn't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id
ON users(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN users.stripe_customer_id IS 'Stripe customer ID (cus_xxx) for payment processing';
