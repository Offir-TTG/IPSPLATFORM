-- ============================================================================
-- ADD GET_USER_DELETED_NOTIFICATIONS FUNCTION
-- ============================================================================
-- Date: 2025-02-01
-- Purpose: Function to retrieve deleted notifications for a user
-- ============================================================================

-- Function to get deleted notifications for a user
CREATE OR REPLACE FUNCTION get_user_deleted_notifications(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
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
  read_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
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
    (nr.read_at IS NOT NULL) as is_read,
    nr.read_at,
    nr.deleted_at
  FROM notifications n
  INNER JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
  WHERE
    -- Only deleted notifications
    nr.is_deleted = TRUE
    AND (
      -- Individual scope: notification directly targets this user
      (n.scope = 'individual' AND n.target_user_id = p_user_id)

      -- Course scope: user is enrolled in a product linked to this course
      OR (n.scope = 'course' AND (
        -- Direct course enrollment
        EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          WHERE prod.course_id = n.target_course_id
          AND e.user_id = p_user_id
          AND e.status = 'active'
        )
        -- OR enrolled in program that contains this course
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          JOIN courses c ON c.program_id = prod.program_id
          WHERE c.id = n.target_course_id
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
  ORDER BY nr.deleted_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Function to get count of deleted notifications
CREATE OR REPLACE FUNCTION get_user_deleted_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT n.id)::INTEGER INTO deleted_count
  FROM notifications n
  INNER JOIN notification_reads nr ON n.id = nr.notification_id AND nr.user_id = p_user_id
  WHERE
    nr.is_deleted = TRUE
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
        OR EXISTS (
          SELECT 1 FROM enrollments e
          JOIN products prod ON prod.id = e.product_id
          JOIN courses c ON c.program_id = prod.program_id
          WHERE c.id = n.target_course_id
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

  RETURN deleted_count;
END;
$$;
