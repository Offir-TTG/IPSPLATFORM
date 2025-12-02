-- Add enrollment wizard fields to enrollments table
-- These fields support the multi-step enrollment wizard flow

-- Add signature tracking fields
ALTER TABLE enrollments
ADD COLUMN IF NOT EXISTS signature_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS docusign_envelope_id VARCHAR(255);

-- Add index for envelope lookups
CREATE INDEX IF NOT EXISTS idx_enrollments_docusign_envelope_id
ON enrollments(docusign_envelope_id)
WHERE docusign_envelope_id IS NOT NULL;

-- Add index for signature status filtering
CREATE INDEX IF NOT EXISTS idx_enrollments_signature_status
ON enrollments(signature_status)
WHERE signature_status IS NOT NULL;

-- Add comment
COMMENT ON COLUMN enrollments.signature_status IS 'DocuSign signature status: sent, delivered, completed, declined, voided';
COMMENT ON COLUMN enrollments.docusign_envelope_id IS 'DocuSign envelope ID for tracking signature requests';
