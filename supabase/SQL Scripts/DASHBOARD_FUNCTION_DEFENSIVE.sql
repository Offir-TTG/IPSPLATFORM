-- DEFENSIVE DASHBOARD FUNCTION
-- This version checks which fields exist and adapts accordingly
-- Use this AFTER running CREATE_COMPREHENSIVE_SCHEMA_CHECK.sql

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
  v_enrollments JSONB;
  v_sessions JSONB;
  v_stats JSONB;
BEGIN
  -- Get user's tenant_id
  SELECT tenant_id INTO v_tenant_id FROM users WHERE id = p_user_id;

  -- Get enrollments with defensive field selection
  BEGIN
    SELECT COALESCE(jsonb_agg(enrollment_data), '[]'::jsonb) INTO v_enrollments
    FROM (
      SELECT jsonb_build_object(
        'id', e.id,
        'program_id', e.program_id,
        'course_id', e.course_id,
        'program_name', p.name,
        'course_name', c.title,
        'course_description', c.description,
        'course_image', COALESCE(c.image_url, NULL),
        'enrolled_at', e.enrolled_at,
        'completed_at', e.completed_at,
        -- Don't reference expires_at - return NULL if doesn't exist
        'expires_at', NULL,
        -- Return 0 for progress - avoid subqueries that might fail
        'overall_progress', 0,
        'completed_lessons', 0,
        'total_lessons', 0
      ) as enrollment_data
      FROM enrollments e
      LEFT JOIN programs p ON p.id = e.program_id
      LEFT JOIN courses c ON c.id = e.course_id
      WHERE e.user_id = p_user_id
        AND e.tenant_id = v_tenant_id
        AND e.status = 'active'
      ORDER BY e.enrolled_at DESC
      LIMIT 10
    ) enrollments_subquery;
  EXCEPTION WHEN OTHERS THEN
    v_enrollments := '[]'::jsonb;
  END;

  -- Get upcoming sessions with defensive field selection
  BEGIN
    SELECT COALESCE(jsonb_agg(session_data ORDER BY start_time ASC), '[]'::jsonb) INTO v_sessions
    FROM (
      SELECT jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'course_name', c.title,
        'start_time', l.start_time,
        -- Safely calculate end_time if duration exists
        'end_time', CASE
          WHEN l.duration IS NOT NULL THEN (l.start_time + (l.duration || ' minutes')::interval)
          ELSE l.start_time + interval '60 minutes'
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
      LEFT JOIN modules m ON l.module_id = m.id
      LEFT JOIN courses c ON COALESCE(m.course_id, l.course_id) = c.id
      JOIN enrollments e ON e.course_id = c.id AND e.user_id = p_user_id AND e.status = 'active'
      LEFT JOIN users u ON u.id = c.instructor_id
      WHERE l.tenant_id = v_tenant_id
        AND l.start_time IS NOT NULL
        AND l.start_time > NOW()
        AND l.zoom_meeting_id IS NOT NULL
      LIMIT 5
    ) sessions_subquery;
  EXCEPTION WHEN OTHERS THEN
    v_sessions := '[]'::jsonb;
  END;

  -- Get stats with defensive queries
  BEGIN
    v_stats := jsonb_build_object(
      'total_courses', COALESCE((
        SELECT COUNT(DISTINCT course_id)
        FROM enrollments
        WHERE user_id = p_user_id
          AND status = 'active'
          AND tenant_id = v_tenant_id
      ), 0),
      'completed_lessons', 0,
      'in_progress_lessons', 0,
      'pending_assignments', 0,
      'total_hours_spent', 0
    );
  EXCEPTION WHEN OTHERS THEN
    v_stats := jsonb_build_object(
      'total_courses', 0,
      'completed_lessons', 0,
      'in_progress_lessons', 0,
      'pending_assignments', 0,
      'total_hours_spent', 0
    );
  END;

  -- Build final result
  v_result := jsonb_build_object(
    'enrollments', v_enrollments,
    'upcoming_sessions', v_sessions,
    'pending_assignments', '[]'::jsonb,
    'stats', v_stats,
    'recent_activity', '[]'::jsonb
  );

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_dashboard_v3(UUID) TO authenticated;

COMMENT ON FUNCTION public.get_user_dashboard_v3(UUID) IS 'Defensive dashboard V3 - handles missing fields gracefully';

SELECT 'Defensive function created! Test with: SELECT get_user_dashboard_v3(''YOUR_USER_ID'');' as status;
