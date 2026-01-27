-- Add refund tracking columns to payments table
-- This migration adds columns needed for tracking refunds in the payments table

DO $$
BEGIN
  -- Add refunded_amount column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'refunded_amount'
  ) THEN
    ALTER TABLE payments ADD COLUMN refunded_amount DECIMAL(10,2) DEFAULT 0;
    COMMENT ON COLUMN payments.refunded_amount IS 'Total amount refunded for this payment';
  END IF;

  -- Add refunded_at column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'refunded_at'
  ) THEN
    ALTER TABLE payments ADD COLUMN refunded_at TIMESTAMPTZ;
    COMMENT ON COLUMN payments.refunded_at IS 'Timestamp when refund was processed';
  END IF;

  -- Add refund_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments'
    AND column_name = 'refund_reason'
  ) THEN
    ALTER TABLE payments ADD COLUMN refund_reason TEXT;
    COMMENT ON COLUMN payments.refund_reason IS 'Reason for the refund';
  END IF;
END $$;
