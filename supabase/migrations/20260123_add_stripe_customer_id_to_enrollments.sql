-- Add stripe_customer_id column to enrollments table
-- This stores the Stripe customer ID with the saved payment method from enrollment wizard
-- Used for charging future installment payments

ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_customer_id
ON enrollments(stripe_customer_id)
WHERE stripe_customer_id IS NOT NULL;

-- Add comment
COMMENT ON COLUMN enrollments.stripe_customer_id IS 'Stripe customer ID (cus_xxx) with saved payment method from enrollment wizard';
