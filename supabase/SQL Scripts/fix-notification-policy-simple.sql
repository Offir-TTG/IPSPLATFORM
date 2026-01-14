-- Simplest possible policy to test if auth is working
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );
