-- Fix: Allow course notifications to reach users enrolled via programs
-- The current logic only checks for direct product→course links
-- This update also checks for product→program→course links

DROP FUNCTION IF EXISTS get_user_notifications(UUID, INT, INT, notification_category, notification_priority, BOOLEAN);

CREATE FUNCTION get_user_notifications(
  p_user_id UUID,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_category notification_category DEFAULT NULL,
  p_priority notification_priority DEFAULT NULL,
  p_unread_only BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  scope notification_scope,
  target_user_id UUID,
  target_course_id UUID,
  target_program_id UUID,
  category notification_category,
  priority notification_priority,
  title TEXT,
  message TEXT,
  metadata JSONB,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  is_read BOOLEAN,
  read_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    n.id,
    n.tenant_id,
    n.scope,
    n.target_user_id,
    n.target_course_id,
    n.target_program_id,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.metadata,
    n.action_url,
    n.action_label,
    n.expires_at,
    n.created_at,
    n.updated_at,
    (nr.id IS NOT NULL) as is_read,
    nr.read_at
  FROM notifications n
  LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
  WHERE
    (n.expires_at IS NULL OR n.expires_at > NOW())
    AND (
      -- Individual scope: notification directly targets this user
      (n.scope = 'individual' AND n.target_user_id = p_user_id)

      -- Course scope: user has access to this course via:
      -- 1. Direct enrollment: product → course
      -- 2. Program enrollment: product → program → course
      OR (n.scope = 'course' AND (
        -- Direct: enrolled in a product linked to this course
        EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          WHERE prod.course_id = n.target_course_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        )
        OR
        -- Via Program: enrolled in a product linked to a program that contains this course
        EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          JOIN program_courses pc ON pc.program_id = prod.program_id
          WHERE pc.course_id = n.target_course_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        )
      ))

      -- Program scope: user is enrolled in a product linked to this program
      OR (n.scope = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.program_id = n.target_program_id
        AND e.user_id = p_user_id
        AND e.status = 'active'
      ))

      -- Tenant scope: user belongs to this tenant
      OR (n.scope = 'tenant' AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = p_user_id
        AND u.tenant_id = n.tenant_id
      ))
    )
    AND (p_category IS NULL OR n.category = p_category)
    AND (p_priority IS NULL OR n.priority = p_priority)
    AND (NOT p_unread_only OR nr.id IS NULL)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Also update the unread count function with the same logic
DROP FUNCTION IF EXISTS get_user_unread_count(UUID);

CREATE OR REPLACE FUNCTION get_user_unread_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT n.id)::INTEGER INTO unread_count
  FROM notifications n
  LEFT JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
  WHERE
    (n.expires_at IS NULL OR n.expires_at > NOW())
    AND nr.id IS NULL
    AND (
      (n.scope = 'individual' AND n.target_user_id = p_user_id)
      OR (n.scope = 'course' AND (
        EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          WHERE prod.course_id = n.target_course_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        )
        OR
        EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          JOIN program_courses pc ON pc.program_id = prod.program_id
          WHERE pc.course_id = n.target_course_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        )
      ))
      OR (n.scope = 'program' AND EXISTS (
        SELECT 1 FROM enrollments e
        JOIN products prod ON prod.id = e.product_id
        WHERE prod.program_id = n.target_program_id
        AND e.user_id = p_user_id
        AND e.status = 'active'
      ))
      OR (n.scope = 'tenant' AND EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = p_user_id
        AND u.tenant_id = n.tenant_id
      ))
    );

  RETURN unread_count;
END;
$$;

COMMENT ON FUNCTION get_user_notifications IS 'Gets notifications for a user with proper scoping including program-based course access';
COMMENT ON FUNCTION get_user_unread_count IS 'Gets unread notification count for a user including program-based course access';
