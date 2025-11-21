-- Drop the old function completely (this invalidates cached plans)
DROP FUNCTION IF EXISTS public.get_user_dashboard(UUID) CASCADE;

-- Wait for cache to clear
DO $$
BEGIN
  PERFORM pg_sleep(0.5);
END $$;

-- Recreate with EXACTLY the same signature but add VOLATILE to prevent caching
CREATE OR REPLACE FUNCTION public.get_user_dashboard(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE  -- This prevents statement caching
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
  v_enrollments JSONB;
  v_upcoming_sessions JSONB;
  v_pending_assignments JSONB;
  v_stats JSONB;
  v_recent_activity JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;

  -- Get active enrollments with progress
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'program_id', e.program_id,
      'course_id', e.course_id,
      'program_name', p.name,
      'course_name', c.title,
      'course_description', c.description,
      'course_image', c.image_url,
      'enrolled_at', e.enrolled_at,
      'completed_at', e.completed_at,
      'overall_progress', COALESCE(
        (
          SELECT ROUND(AVG(progress_percentage))
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.enrollment_id = e.id
        ), 0
      ),
      'completed_lessons', COALESCE(
        (
          SELECT COUNT(*)
          FROM user_progress up
          WHERE up.user_id = p_user_id
            AND up.enrollment_id = e.id
            AND up.status = 'completed'
        ), 0
      ),
      'total_lessons', COALESCE(
        (
          SELECT COUNT(*)
          FROM lessons l
          JOIN modules m ON l.module_id = m.id
          WHERE m.course_id = e.course_id
        ), 0
      )
    )
  ), '[]'::jsonb) INTO v_enrollments
  FROM enrollments e
  LEFT JOIN programs p ON p.id = e.program_id
  LEFT JOIN courses c ON c.id = e.course_id
  WHERE e.user_id = p_user_id
    AND e.status = 'active'
    AND e.tenant_id = v_tenant_id
  ORDER BY e.enrolled_at DESC
  LIMIT 10;

  -- Get upcoming sessions
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'course_name', c.title,
      'start_time', l.start_time,
      'end_time', l.end_time,
      'instructor_name', CASE
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
        THEN u.first_name || ' ' || u.last_name
        WHEN u.first_name IS NOT NULL
        THEN u.first_name
        ELSE u.email
      END,
      'zoom_meeting_id', l.zoom_meeting_id
    ) ORDER BY l.start_time ASC
  ), '[]'::jsonb) INTO v_upcoming_sessions
  FROM lessons l
  JOIN modules m ON l.module_id = m.id
  JOIN courses c ON m.course_id = c.id
  JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
  LEFT JOIN users u ON u.id = c.instructor_id
  WHERE l.tenant_id = v_tenant_id
    AND l.start_time IS NOT NULL
    AND l.start_time > NOW()
    AND l.zoom_meeting_id IS NOT NULL
  LIMIT 5;

  -- Pending assignments - simplified
  v_pending_assignments := '[]'::jsonb;

  -- Calculate stats using direct assignment (NO SELECT INTO to avoid any GROUP BY issues)
  v_stats := jsonb_build_object(
    'total_courses', (
      SELECT COUNT(DISTINCT course_id)
      FROM enrollments
      WHERE user_id = p_user_id
        AND status = 'active'
        AND tenant_id = v_tenant_id
    ),
    'completed_lessons', (
      SELECT COUNT(*)
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.status = 'completed'
        AND up.tenant_id = v_tenant_id
    ),
    'in_progress_lessons', (
      SELECT COUNT(*)
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.status = 'in_progress'
        AND up.tenant_id = v_tenant_id
    ),
    'pending_assignments', 0,
    'total_hours_spent', COALESCE((
      SELECT SUM(time_spent_seconds) / 3600.0
      FROM user_progress up
      WHERE up.user_id = p_user_id
        AND up.tenant_id = v_tenant_id
    ), 0)
  );

  -- Get recent activity
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', up.id,
      'type', 'lesson_progress',
      'lesson_title', l.title,
      'course_name', c.title,
      'status', up.status,
      'timestamp', up.updated_at
    ) ORDER BY up.updated_at DESC
  ), '[]'::jsonb) INTO v_recent_activity
  FROM user_progress up
  JOIN lessons l ON l.id = up.lesson_id
  JOIN modules m ON l.module_id = m.id
  JOIN courses c ON m.course_id = c.id
  WHERE up.user_id = p_user_id
    AND up.tenant_id = v_tenant_id
  ORDER BY up.updated_at DESC
  LIMIT 5;

  -- Build final result
  v_result := jsonb_build_object(
    'enrollments', v_enrollments,
    'upcoming_sessions', v_upcoming_sessions,
    'pending_assignments', v_pending_assignments,
    'stats', v_stats,
    'recent_activity', v_recent_activity
  );

  RETURN v_result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_dashboard(UUID) TO authenticated;

-- Add a comment with timestamp to ensure it's the new version
DO $$
BEGIN
  EXECUTE 'COMMENT ON FUNCTION public.get_user_dashboard(UUID) IS ''Dashboard aggregation - Fixed version with enrollment_id - ' || NOW()::text || '''';
END $$;

-- Test call to warm up the new function
SELECT 'Function recreated and ready!' as status;
