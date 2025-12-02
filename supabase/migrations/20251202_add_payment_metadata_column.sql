-- Migration: Add payment_metadata column to enrollments table
-- Purpose: Store payment-related metadata for enrollments
-- This fixes the error: "Could not find the 'payment_metadata' column"
-- Created: 2025-12-02

-- Add JSONB column to store payment metadata
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS payment_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for efficient JSON querying
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_metadata
ON enrollments USING GIN (payment_metadata);

-- Add comment for documentation
COMMENT ON COLUMN enrollments.payment_metadata IS
'Stores payment-related metadata including processing timestamps, auto-detected plans, and custom payment information.';

-- Verify the column was added successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'enrollments'
    AND column_name = 'payment_metadata'
  ) THEN
    RAISE NOTICE 'Successfully added payment_metadata column to enrollments table';
  ELSE
    RAISE EXCEPTION 'Failed to add payment_metadata column';
  END IF;
END $$;
