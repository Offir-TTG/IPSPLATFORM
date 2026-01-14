-- Fix the admin insert policy for notifications table
-- This script updates ONLY the INSERT policy to allow admins to create notifications

DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
    )
    AND
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
