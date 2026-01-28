-- Remove unique constraint that prevents duplicate enrollments
-- This allows users to enroll multiple times in the same product
-- Use cases: parents enrolling children, re-enrollment, different sessions, etc.

-- Drop the unique constraint
ALTER TABLE enrollments
DROP CONSTRAINT IF EXISTS enrollments_user_id_product_id_tenant_id_key;

-- Add comment explaining why duplicates are allowed
COMMENT ON TABLE enrollments IS
'Enrollments table - allows multiple enrollments per user+product combination.
Use cases: parent enrollments, re-enrollment, different time slots, group registrations.
Each enrollment is a separate instance with its own payment schedules and status.';

-- Create index for efficient lookups (non-unique)
CREATE INDEX IF NOT EXISTS idx_enrollments_user_product_tenant
ON enrollments(user_id, product_id, tenant_id)
WHERE user_id IS NOT NULL;

COMMENT ON INDEX idx_enrollments_user_product_tenant IS
'Non-unique index for efficient enrollment lookups by user+product+tenant.
Allows multiple enrollments while maintaining query performance.';
