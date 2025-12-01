-- =====================================================
-- Add Override Flags to Enrollments Table
-- =====================================================
-- Allow admins to waive payment or signature requirements
-- for specific enrollments (scholarships, staff, special cases)
-- =====================================================

-- Add override columns
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS payment_waived BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS signature_waived BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN enrollments.payment_waived IS 'Admin override: payment requirement waived for this enrollment (scholarship, staff, etc.)';
COMMENT ON COLUMN enrollments.signature_waived IS 'Admin override: DocuSign signature requirement waived for this enrollment';

-- Create index for filtering waived enrollments (for reporting)
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_waived ON enrollments(payment_waived) WHERE payment_waived = true;
CREATE INDEX IF NOT EXISTS idx_enrollments_signature_waived ON enrollments(signature_waived) WHERE signature_waived = true;

-- Add audit trail comment
COMMENT ON TABLE enrollments IS 'User enrollments to products with payment tracking. Includes override flags for admins to waive requirements (payment_waived, signature_waived) for special cases like scholarships or staff enrollments.';
