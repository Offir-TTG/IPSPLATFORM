-- Fix RLS policies for payments table to allow admin access
-- This allows admins and super_admins to read payments for their tenant

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read payments for their tenant" ON payments;

-- Create policy for admins to read payments
CREATE POLICY "Admins can read payments for their tenant"
ON payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.tenant_id = payments.tenant_id
    AND users.role IN ('admin', 'super_admin')
  )
);

-- Ensure RLS is enabled
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
