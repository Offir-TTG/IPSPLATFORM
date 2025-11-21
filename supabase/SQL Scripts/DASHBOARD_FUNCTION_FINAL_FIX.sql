-- FINAL FIX: Removes expires_at and uses course_id (confirmed working schema)
-- Based on actual error: enrollments table does NOT have expires_at column

DROP FUNCTION IF EXISTS public.get_user_dashboard_v3(UUID) CASCADE;

CREATE FUNCTION public.get_user_dashboard_v3(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id UUID;
  v_result JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id
  FROM users
  WHERE id = p_user_id;

  -- Build complete dashboard data (no expires_at, uses course_id)
  SELECT jsonb_build_object(
    'enrollments', (
      SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', e.id,
          'program_id', e.program_id,
          'course_id', e.course_id,
          'program_name', p.name,
          'course_name', c.title,
          'course_description', c.description,
          'course_image', c.image_url,
          'enrolled_at', e.enrolled_at,
          'completed_at', e.completed_at,
          'expires_at', NULL,
          'overall_progress', COALESCE(
            (
              SELECT ROUND(AVG(progress_percentage))
              FROM user_progress up
              WHERE up.user_id = p_user_id
                AND up.course_id = e.course_id
            ), 0
          ),
          'completed_lessons', COALESCE(
            (
              SELECT COUNT(DISTINCT up.lesson_id)
              FROM user_progress up
              WHERE up.user_id = p_user_id
                AND up.course_id = e.course_id
                AND up.status = 'completed'
                AND up.lesson_id IS NOT NULL
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
        ) as enrollment_data
        FROM enrollments e
        LEFT JOIN programs p ON p.id = e.program_id
        LEFT JOIN courses c ON c.id = e.course_id
        WHERE e.user_id = p_user_id
          AND e.status = 'active'
          AND e.tenant_id = v_tenant_id
        ORDER BY e.enrolled_at DESC
        LIMIT 10
      ) enrollments_subquery
    ),
    'upcoming_sessions', (
      SELECT COALESCE(jsonb_agg(session_data ORDER BY start_time ASC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', l.id,
          'title', l.title,
          'course_name', c.title,
          'start_time', l.start_time,
          'end_time', CASE
            WHEN l.end_time IS NOT NULL THEN l.end_time
            ELSE (l.start_time + (COALESCE(l.duration, 60) || ' minutes')::interval)
          END,
          'instructor_name', CASE
            WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL
            THEN u.first_name || ' ' || u.last_name
            WHEN u.first_name IS NOT NULL
            THEN u.first_name
            ELSE u.email
          END,
          'zoom_meeting_id', l.zoom_meeting_id
        ) as session_data,
        l.start_time
        FROM lessons l
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
        LEFT JOIN users u ON u.id = c.instructor_id
        WHERE l.tenant_id = v_tenant_id
          AND l.start_time IS NOT NULL
          AND l.start_time > NOW()
          AND l.zoom_meeting_id IS NOT NULL
        LIMIT 5
      ) sessions_subquery
    ),
    'pending_assignments', '[]'::jsonb,
    'stats', jsonb_build_object(
      'total_courses', (
        SELECT COUNT(DISTINCT course_id)
        FROM enrollments
        WHERE user_id = p_user_id
          AND status = 'active'
          AND tenant_id = v_tenant_id
      ),
      'completed_lessons', (
        SELECT COUNT(DISTINCT lesson_id)
        FROM user_progress
        WHERE user_id = p_user_id
          AND status = 'completed'
          AND tenant_id = v_tenant_id
          AND lesson_id IS NOT NULL
      ),
      'in_progress_lessons', (
        SELECT COUNT(DISTINCT lesson_id)
        FROM user_progress
        WHERE user_id = p_user_id
          AND status = 'in_progress'
          AND tenant_id = v_tenant_id
          AND lesson_id IS NOT NULL
      ),
      'pending_assignments', 0,
      'total_hours_spent', COALESCE((
        SELECT SUM(COALESCE(time_spent_seconds, time_spent_minutes * 60, 0)) / 3600.0
        FROM user_progress
        WHERE user_id = p_user_id
          AND tenant_id = v_tenant_id
      ), 0)
    ),
    'recent_activity', (
      SELECT COALESCE(jsonb_agg(activity_data ORDER BY updated_at DESC), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object(
          'id', up.id,
          'type', 'lesson_progress',
          'lesson_title', l.title,
          'course_name', c.title,
          'status', up.status,
          'timestamp', up.updated_at
        ) as activity_data,
        up.updated_at
        FROM user_progress up
        JOIN lessons l ON l.id = up.lesson_id
        JOIN modules m ON l.module_id = m.id
        JOIN courses c ON m.course_id = c.id
        WHERE up.user_id = p_user_id
          AND up.tenant_id = v_tenant_id
          AND up.lesson_id IS NOT NULL
        ORDER BY up.updated_at DESC
        LIMIT 5
      ) activity_subquery
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS 'Dashboard V3 - Final working version: no expires_at, uses course_id, handles end_time';

SELECT 'Function get_user_dashboard_v3 created successfully!' as status;
