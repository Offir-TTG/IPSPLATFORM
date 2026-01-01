-- FINAL FIX for notification INSERT RLS policy
-- The issue: In PostgreSQL RLS WITH CHECK for INSERT, you cannot use table-qualified column names
-- Solution: Use a subquery with the bare column name

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    -- Check 1: User must be admin or super_admin
    auth.uid() IN (
      SELECT id FROM users
      WHERE role IN ('admin', 'super_admin')
    )
    AND
    -- Check 2: tenant_id being inserted must match user's tenant_id
    tenant_id = (
      SELECT tenant_id FROM users
      WHERE id = auth.uid()
    )
  );
