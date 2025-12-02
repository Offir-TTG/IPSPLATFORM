# URGENT: Run This Migration First!

The enrollment wizard reset feature requires new columns in the `enrollments` table.

## Run This SQL in Supabase SQL Editor

```sql
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
```

## Steps

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the SQL above
4. Click "Run"
5. Refresh your application

## What This Does

- Adds `signature_status` column to track DocuSign signing status
- Adds `docusign_envelope_id` column to link to DocuSign envelopes
- Creates indexes for performance
- Adds helpful comments to the columns

After running this, the Reset Enrollment button will work correctly!
