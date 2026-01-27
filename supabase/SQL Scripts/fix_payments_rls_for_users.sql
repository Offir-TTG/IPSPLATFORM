-- Fix RLS policies on payments table to allow users to see their own payment records
-- This is needed for displaying refund information in the UI

-- Drop existing SELECT policy for users (if it exists)
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;

-- Create new SELECT policy allowing users to see payments for their enrollments
CREATE POLICY "Users can view their own payments"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM enrollments
    WHERE enrollments.id = payments.enrollment_id
      AND enrollments.user_id = auth.uid()
  )
);

-- Verify the policy was created
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'payments'
  AND policyname = 'Users can view their own payments';
