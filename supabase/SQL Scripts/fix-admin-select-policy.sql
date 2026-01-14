-- Add SELECT policy for admins to view all notifications in their tenant

DROP POLICY IF EXISTS "Admins can view all tenant notifications" ON notifications;

CREATE POLICY "Admins can view all tenant notifications" ON notifications
  FOR SELECT
  USING (
    -- Admins can see all notifications in their tenant
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role IN ('admin', 'super_admin')
      AND u.tenant_id = notifications.tenant_id
    )
    OR
    -- Regular users see notifications based on scope (existing policy)
    (
      scope = 'individual' AND target_user_id = auth.uid()
      OR scope = 'course' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.course_id = target_course_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
      )
      OR scope = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.program_id = target_program_id
        AND e.user_id = auth.uid()
        AND e.status = 'active'
      )
      OR scope = 'tenant' AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.tenant_id = notifications.tenant_id
      )
    )
  );
