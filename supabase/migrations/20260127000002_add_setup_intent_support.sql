-- Add Setup Intent support for installment plans without deposits
-- This allows saving cards without charging during enrollment

-- Add stripe_setup_intent_id column to enrollments table
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS stripe_setup_intent_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_stripe_setup_intent_id
ON enrollments(stripe_setup_intent_id);

-- Add column comment
COMMENT ON COLUMN enrollments.stripe_setup_intent_id IS
'Stripe Setup Intent ID for installment plans without deposit (card saved but not charged during enrollment). Used when payment_plan has no deposit but requires card on file for future payments.';
