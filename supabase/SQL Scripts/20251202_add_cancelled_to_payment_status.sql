-- =====================================================
-- Add 'cancelled' to payment_status CHECK constraint
-- =====================================================
-- Allows setting payment_status to 'cancelled' when cancelling enrollments
-- =====================================================

-- Drop the existing CHECK constraint
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_payment_status_check;

-- Add the new CHECK constraint with 'cancelled' option
ALTER TABLE enrollments
ADD CONSTRAINT enrollments_payment_status_check
CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled'));

-- Update the column comment to reflect the new option
COMMENT ON COLUMN enrollments.payment_status IS 'Payment status: pending, partial, paid, overdue, or cancelled';
