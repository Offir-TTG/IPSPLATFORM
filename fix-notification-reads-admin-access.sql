-- Fix: Allow admins to view all notification_reads in their tenant for statistics

DROP POLICY IF EXISTS "Admins can view all notification reads in tenant" ON notification_reads;

CREATE POLICY "Admins can view all notification reads in tenant" ON notification_reads
  FOR SELECT
  USING (
    -- Regular users can see their own reads
    user_id = auth.uid()
    OR
    -- Admins can see all reads in their tenant
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.tenant_id = (
        SELECT tenant_id FROM users WHERE id = notification_reads.user_id
      )
    )
  );

-- Also update the old policy name for clarity
DROP POLICY IF EXISTS "Users can view their read status" ON notification_reads;
